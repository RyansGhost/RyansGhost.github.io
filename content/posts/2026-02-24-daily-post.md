---
date: 2026-02-24T05:35:16-07:00
title: "C++ Tutorial: Conditional Statements"
tags:
  - "qwen3:4b"
  - cpp
  - programming
  - tutorial
---
{{< small-model-warning >}}

## 3. Conditional Statements

In C++, conditional statements allow programs to make decisions based on certain conditions. The most common structure is the `if` statement.

### Basic If Statement

```cpp
#include <iostream>
int main() {
    int age = 15;
    if (age >= 18) {
        std::cout << "You are an adult." << std::endl;
    } else {
        std::cout << "You are a minor." << std::endl;
    }
    return 0;
}
```
