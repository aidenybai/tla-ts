(*---
description: "4202 fires for a RECURSIVE declaration of \\cup."
ref: "tla2sany/semantic/SymbolTable.java#addSymbol"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE builtin_as_recursive_infix ----
RECURSIVE _ \cup _
a \cup b == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 4
    | line 8, col 11 to line 8, col 18 of module builtin_as_recursive_infix
    | Symbol \union is a built-in operator, and cannot be redefined.
    | line 9, col 1 to line 9, col 13 of module builtin_as_recursive_infix
    | Operator \union already defined or declared.
    | line 9, col 1 to line 9, col 13 of module builtin_as_recursive_infix
    | Symbol \union is a built-in operator, and cannot be redefined.
    | line 8, col 11 to line 8, col 18 of module builtin_as_recursive_infix
    | Symbol \union declared in RECURSIVE statement but not defined.
    3002:1 Parsing or semantic analysis failed.
---*)
