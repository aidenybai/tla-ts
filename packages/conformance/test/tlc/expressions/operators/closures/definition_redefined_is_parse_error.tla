(*---
description: "Redefining a name in the same module is a parse error."
ref: "tla2sany/semantic/Generator.java"
flags: [expression]
outcome: parse-error
---*)
---- MODULE definition_redefined_is_parse_error ----
EXTENDS Integers
F == 1
F == 2
Test == F = 2
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | *** Warnings: 1
    | line 10, col 1 to line 10, col 6 of module definition_redefined_is_parse_error
    | Multiple declarations or definitions for symbol F.  
    | This duplicates the one at line 9, col 1 to line 9, col 6 of module definition_redefined_is_parse_error.
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 1 to line 10, col 6 of module definition_redefined_is_parse_error
    | Operator F already defined or declared.
    3002:1 Parsing or semantic analysis failed.
---*)
