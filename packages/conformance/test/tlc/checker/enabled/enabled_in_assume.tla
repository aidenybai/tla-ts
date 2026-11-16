(*---
description: ENABLED in an ASSUME is rejected by the semantic pass, because an assumption must be constant level.
ref: tla2sany/semantic/ModuleNode.java#levelCheck
outcome: parse-error
config: |
  INIT Init
  NEXT Next
---*)
---- MODULE enabled_in_assume ----
VARIABLE x
ASSUME ENABLED TRUE
Init == x = 0
Next == x' = x
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 11, col 1 to line 11, col 19 of module enabled_in_assume
    | Level error: assumptions must be level 0 (Constant), 
    | but this one has level 1.
    3002:1 Parsing or semantic analysis failed.
---*)
