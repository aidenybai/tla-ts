(*---
description: The named module becomes an extendee of the root, so a module that doesn't exist is a parse failure.
ref: tlc2/tool/impl/ParameterizedSpecObj.java#findOrCreateParsedUnit
outcome: parse-error
config: |
  INIT Init
  NEXT Next
args:
  - -postCondition
  - NoSuchModule!Op
---*)
---- MODULE unknown_module ----
EXTENDS Naturals
VARIABLE x
Init == x = 0
Next == x' = (x + 1) % 3
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file unknown_module
    | In module unknown_module
    | Cannot find source file for module NoSuchModule imported in module unknown_module.
    | *** Errors: 1
    | In module unknown_module
    | Cannot find source file for module NoSuchModule imported in module unknown_module.
    3002:1 Parsing or semantic analysis failed.
---*)
