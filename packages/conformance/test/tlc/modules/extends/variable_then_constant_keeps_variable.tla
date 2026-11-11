(*---
description: "With the variable first, the name remains a variable, so a constant-level assumption on it is a level error."
ref: "tla2sany/semantic/Context.java#mergeExtendContext"
features: [extends]
includes: [FixConstant.tla, FixVariable.tla]
outcome: parse-error
---*)
---- MODULE variable_then_constant_keeps_variable ----
EXTENDS FixVariable, FixConstant
ASSUME Shared = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | *** Warnings: 1
    | line 2, col 10 to line 2, col 15 of module FixConstant
    | Warning: the declaration of 'Shared' conflicts with 
    | its declaration at line 2, col 10 to line 2, col 15 of module FixVariable.
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 1 to line 10, col 17 of module variable_then_constant_keeps_variable
    | Level error: assumptions must be level 0 (Constant), 
    | but this one has level 1.
    3002:1 Parsing or semantic analysis failed.
---*)
