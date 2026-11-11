(*---
description: INSTANCE With Operator Substitutions. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/unit.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE unit_instance_with_operator_substitutions ----
INSTANCE M WITH
  A <- a,
  SUBSET <- b,
  * <- c,
  ' <- d
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file unit_instance_with_operator_substitutions
    | In module unit_instance_with_operator_substitutions
    | Cannot find source file for module M imported in module unit_instance_with_operator_substitutions.
    | *** Errors: 1
    | In module unit_instance_with_operator_substitutions
    | Cannot find source file for module M imported in module unit_instance_with_operator_substitutions.
    3002:1 Parsing or semantic analysis failed.
---*)
