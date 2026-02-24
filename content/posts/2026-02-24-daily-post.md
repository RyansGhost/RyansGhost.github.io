---

title: "Beginner C++ Tutorial"
date: 2026-02-24
---

# Beginner C++ Tutorial

Welcome to the world of C++! This guide is designed for beginners to get started with C++ programming.

## 1. Hello World

The simplest C++ program:

```cpp
#include <iostream>
int main() {
    std::cout << "Hello, World!";
    return 0;
}
``` 

## 2. Compiling and Running

To compile and run the Hello World program, follow these steps:

1. Save the code in a file named `hello.cpp`.
2. Open a terminal and navigate to your project directory.
3. Run: `g++ hello.cpp -o hello`
4. Execute: `./hello` to see "Hello, World!" in your terminal.

## 3. Variables and Data Types

Before writing useful programs, let's learn about variables and data types:

- **Variables** are containers for storing data.
- **Data types** define the kind of data a variable can hold.

### Basic Data Types

| Type | Example | Explanation |
|------|--------|--------------|
| `int` | `int age = 25;` | Integer values |
| `float` | `float height = 5.8;` | Decimal values |
| `char` | `char initial = 'J';` | Single characters |
| `string` | `string name = "Alice";` | Text |

### Using Variables

```cpp
#include <iostream>
int main() {
    int x = 10;
    float y = 3.14;
    char c = 'A';
    std::string name = "John";

    std::cout << "x = " << x << ", y = " << y << ", and " << name << std::endl;
    return 0;
}
```