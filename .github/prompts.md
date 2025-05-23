# GitHub Copilot Prompt for Horse Racing Game Project

## Project Overview
This project is a horse racing game built using the Phaser game framework. The game simulates a race where multiple horses compete to reach the finish line. The game includes features such as physics-based movement, collision handling, and dynamic race mechanics.

## Key Features
- **Physics Engine**: The game uses Phaser's Arcade Physics for realistic movement and collision handling.
- **Dynamic Race Mechanics**: Horses have randomized speeds, accelerations, and movements to simulate a realistic race.
- **Interactive Gameplay**: Players can start the race by clicking, and the game determines the winner dynamically.
- **Customizable Track and Horses**: The track and horses are drawn programmatically, allowing for easy customization.

## File Structure
- `src/main.ts`: Entry point of the game.
- `src/game/scenes/`: Contains various game scenes such as `Racing.ts` for the race logic, `MainMenu.ts` for the main menu, and more.
- `docs/`: Contains static assets like images, styles, and the HTML file.

## How to Use GitHub Copilot
- Use Copilot to generate new features, such as additional game mechanics or UI elements.
- Ask Copilot to refactor existing code for better performance or readability.
- Use Copilot to debug issues or suggest improvements in the game logic.

## Example Prompts
- "Add a betting system where players can bet on a horse before the race starts."
- "Implement a leaderboard to track the fastest race times."
- "Create a new scene for displaying race statistics after the game ends."

## Notes
- Ensure that all new features integrate seamlessly with the existing Phaser framework setup.
- Follow best practices for game development and maintain clean, modular code.
## 말의 움직임
Horse는 물리엔진의 가속도를 통해서 이동계산을 한다.