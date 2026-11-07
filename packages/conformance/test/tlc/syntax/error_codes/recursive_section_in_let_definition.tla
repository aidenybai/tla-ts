(*---
description: "A LET's section does not close the module's."
ref: "tla2sany/semantic/Generator.java#processRecursive"
features: [error_codes]
outcome: parse-error
---*)
---- MODULE recursive_section_in_let_definition ----
RECURSIVE F
A == LET RECURSIVE G
         G == 1
     IN G
CONSTANT c
F == A
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 12, col 1 to line 12, col 10 of module recursive_section_in_let_definition
    | A declaration may not appear within a recursive definition section.
    3002:1 Parsing or semantic analysis failed.
---*)
