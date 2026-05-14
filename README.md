# Convolutional Visualizer

Convolutional Visualizer is a React-based web application designed to help users understand and visualize the inner workings of convolutional neural networks (CNNs). This tool provides an interactive interface to explore how CNNs process data, making it an excellent resource for students, educators, and machine learning enthusiasts.

## Features

- **Interactive Canvas**: Visualize convolution operations step-by-step.
- **Computation Trace**: Track the intermediate computations of the CNN layers.
- **Sidebar**: Adjust parameters such as kernel size, stride, and padding in real-time.
- **Customizable Inputs**: Upload your own images or use sample data.
- **Modular Design**: Built with reusable React components for easy extension.

## Installation

### Prerequisites

Ensure you have the following installed on your system:
- Node.js (v16 or later)
- npm (Node Package Manager)

### Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/conv-visual.git
   ```
2. Navigate to the project directory:
   ```bash
   cd conv-visual
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

## Usage

To start the development server, run:
```bash
npm run dev
```

The application will be available at `http://localhost:5173` by default.

## Project Structure

- **src/**: Contains the source code for the application.
  - **components/**: Reusable React components such as `Canvas`, `ComputationTrace`, and `Sidebar`.
  - **lib/**: Utility functions and CNN-related logic.
- **index.html**: Entry point for the application.
- **vite.config.ts**: Configuration file for Vite.

## Contributing

Contributions are welcome! If you'd like to contribute, please fork the repository and submit a pull request.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Testing

![Test Status](https://github.com/your-username/conv-visual/actions/workflows/test.yml/badge.svg)

This project includes unit tests to ensure the reliability of its components and utilities. To run the tests, use the following command:

```bash
npm run test
```

Test files are located alongside the components and utilities they test, following the convention `*.test.ts` or `*.test.tsx`.
