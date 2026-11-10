(*---
description: Disjlist with INSTANCE in LET/IN. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/let_in.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE let_in_disjlist_with_instance_in_let_in ----
op ==
  \/ LET M1 == INSTANCE M2 IN P
  \/ Q
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file let_in_disjlist_with_instance_in_let_in
    | In module let_in_disjlist_with_instance_in_let_in
    | Cannot find source file for module M2 imported in module let_in_disjlist_with_instance_in_let_in.
    | *** Errors: 1
    | In module let_in_disjlist_with_instance_in_let_in
    | Cannot find source file for module M2 imported in module let_in_disjlist_with_instance_in_let_in.
    3002:1 Parsing or semantic analysis failed.
---*)
