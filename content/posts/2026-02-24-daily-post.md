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