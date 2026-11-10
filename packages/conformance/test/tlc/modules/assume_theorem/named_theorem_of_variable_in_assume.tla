(*---
description: "A named theorem over a variable has state level, so an ASSUME cannot use it."
ref: "tla2sany/semantic/AssumeNode.java#levelCheck"
features: [assume_theorem]
outcome: parse-error
---*)
---- MODULE named_theorem_of_variable_in_assume ----
VARIABLE v
THEOREM T == v = v
ASSUME T
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 10, col 1 to line 10, col 8 of module named_theorem_of_variable_in_assume
    | Level error: assumptions must be level 0 (Constant), 
    | but this one has level 1.
    3002:1 Parsing or semantic analysis failed.
---*)
