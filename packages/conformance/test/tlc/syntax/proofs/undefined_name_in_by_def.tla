(*---
description: SANY still resolves a BY DEF name.
ref: "tla2sany/semantic/Generator.java#selectorToNode"
features: [proofs]
outcome: parse-error
---*)
---- MODULE undefined_name_in_by_def ----
THEOREM TRUE BY DEF DoesNotExist
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 3
    | line 8, col 21 to line 8, col 32 of module undefined_name_in_by_def
    | Unknown operator: `DoesNotExist'.
    | line 8, col 21 to line 8, col 32 of module undefined_name_in_by_def
    | DEF clause entry should describe a defined operator.
    | line 8, col 14 to line 8, col 32 of module undefined_name_in_by_def
    | Empty BY
    3002:1 Parsing or semantic analysis failed.
---*)
