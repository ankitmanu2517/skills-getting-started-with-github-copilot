import copy
import pytest
from fastapi.testclient import TestClient

from src.app import app, activities

client = TestClient(app)


@pytest.fixture(autouse=True)
def reset_activities():
    """Restore the activities dict to its original state after each test."""
    original = copy.deepcopy(activities)
    yield
    activities.clear()
    activities.update(original)


# ---------------------------------------------------------------------------
# GET /activities
# ---------------------------------------------------------------------------

def test_get_activities():
    # Arrange
    expected_activity_count = 9

    # Act
    response = client.get("/activities")

    # Assert
    assert response.status_code == 200
    assert len(response.json()) == expected_activity_count


# ---------------------------------------------------------------------------
# POST /activities/{activity_name}/signup
# ---------------------------------------------------------------------------

def test_signup_success():
    # Arrange
    activity_name = "Chess Club"
    new_email = "newstudent@mergington.edu"

    # Act
    response = client.post(
        f"/activities/{activity_name}/signup",
        params={"email": new_email},
    )

    # Assert
    assert response.status_code == 200
    assert response.json() == {"message": f"Signed up {new_email} for {activity_name}"}
    assert new_email in activities[activity_name]["participants"]


def test_signup_activity_not_found():
    # Arrange
    activity_name = "Nonexistent Club"
    email = "student@mergington.edu"

    # Act
    response = client.post(
        f"/activities/{activity_name}/signup",
        params={"email": email},
    )

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_signup_already_enrolled():
    # Arrange
    activity_name = "Chess Club"
    existing_email = "michael@mergington.edu"  # already in Chess Club

    # Act
    response = client.post(
        f"/activities/{activity_name}/signup",
        params={"email": existing_email},
    )

    # Assert
    assert response.status_code == 400
    assert response.json()["detail"] == "Student already signed up"


# ---------------------------------------------------------------------------
# DELETE /activities/{activity_name}/participants
# ---------------------------------------------------------------------------

def test_unregister_success():
    # Arrange
    activity_name = "Chess Club"
    enrolled_email = "michael@mergington.edu"  # already in Chess Club

    # Act
    response = client.delete(
        f"/activities/{activity_name}/participants",
        params={"email": enrolled_email},
    )

    # Assert
    assert response.status_code == 200
    assert response.json() == {"message": f"Unregistered {enrolled_email} from {activity_name}"}
    assert enrolled_email not in activities[activity_name]["participants"]


def test_unregister_activity_not_found():
    # Arrange
    activity_name = "Nonexistent Club"
    email = "student@mergington.edu"

    # Act
    response = client.delete(
        f"/activities/{activity_name}/participants",
        params={"email": email},
    )

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"


def test_unregister_participant_not_found():
    # Arrange
    activity_name = "Chess Club"
    unenrolled_email = "nobody@mergington.edu"  # not in Chess Club

    # Act
    response = client.delete(
        f"/activities/{activity_name}/participants",
        params={"email": unenrolled_email},
    )

    # Assert
    assert response.status_code == 404
    assert response.json()["detail"] == "Participant not found in this activity"
