(*---
description: A built-in may not be declared RECURSIVE.
ref: "tla2sany/semantic/Generator.java#processRecursive"
features: [recursive]
outcome: parse-error
---*)
---- MODULE builtin_declared ----
RECURSIVE TRUE
TRUE == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 4
    | line 8, col 11 to line 8, col 14 of module builtin_declared
    | Symbol TRUE is a built-in operator, and cannot be redefined.
    | line 9, col 1 to line 9, col 9 of module builtin_declared
    | Operator TRUE already defined or declared.
    | line 9, col 1 to line 9, col 9 of module builtin_declared
    | Symbol TRUE is a built-in operator, and cannot be redefined.
    | line 8, col 11 to line 8, col 14 of module builtin_declared
    | Symbol TRUE declared in RECURSIVE statement but not defined.
    3002:1 Parsing or semantic analysis failed.
---*)
