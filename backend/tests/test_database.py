from fastapi.testclient import TestClient


def test_reference_data_is_seeded(client: TestClient) -> None:
    rooms = client.get("/api/rooms")
    applications = client.get("/api/applications")
    uses = client.get("/api/uses")
    pipette_types = client.get("/api/pipette-types")

    assert rooms.status_code == 200
    assert applications.status_code == 200
    assert uses.status_code == 200
    assert pipette_types.status_code == 200
    assert {room["name"] for room in rooms.json()} == {"Labor 1a", "Labor 1b", "Labor 3"}
    assert "PCR-Platz" in {application["name"] for application in applications.json()}
    assert {usage["name"] for usage in uses.json()} == {"FuE", "Prüfungen"}
    assert "Luftpolsterpipette" in {item["name"] for item in pipette_types.json()}


def test_pipette_can_be_created_and_listed(client: TestClient) -> None:
    room_id = client.get("/api/rooms").json()[0]["id"]
    application_id = client.get("/api/applications").json()[0]["id"]
    use_id = client.get("/api/uses").json()[0]["id"]
    pipette_type_id = client.get("/api/pipette-types").json()[0]["id"]

    response = client.post(
        "/api/pipettes",
        json={
            "manufacturer": "Eppendorf",
            "model_name": "Research plus",
            "inventory_number": "L00123",
            "serial_number": "SN123456",
            "channel_count": 1,
            "use_id": use_id,
            "pipette_type_id": pipette_type_id,
            "nominal_volume_ul": 100,
            "calibration_interval_months": 12,
            "application_id": application_id,
            "room_id": room_id,
        },
    )

    assert response.status_code == 201
    created = response.json()
    assert created["register_number"] == 1
    assert created["description"] == "Eppendorf Research plus 100 µL"

    list_response = client.get("/api/pipettes?q=SN123456")

    assert list_response.status_code == 200
    assert len(list_response.json()) == 1
    assert list_response.json()[0]["inventory_number"] == "L00123"
