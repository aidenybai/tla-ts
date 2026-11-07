(*---
description: INSTANCE With Jlist Substitutions. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/unit.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE unit_instance_with_jlist_substitutions ----
INSTANCE M WITH
  A <- /\ 1,
  B <- /\ 2,
  C <- /\ \/ 3
          \/ 4,
  D <- \/ 5
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file unit_instance_with_jlist_substitutions
    | In module unit_instance_with_jlist_substitutions
    | Cannot find source file for module M imported in module unit_instance_with_jlist_substitutions.
    | *** Errors: 1
    | In module unit_instance_with_jlist_substitutions
    | Cannot find source file for module M imported in module unit_instance_with_jlist_substitutions.
    3002:1 Parsing or semantic analysis failed.
---*)
