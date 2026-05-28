Feature: Application Health
  As a user
  I want the autarq-hub application to be running and reachable
  So that I can access the platform

  Scenario: Start page is reachable
    Given the autarq-hub application is running
    When I visit the root URL "/"
    Then I should see the autarq-hub start page
    And the response status should be 200
