(*---
description: LOCAL Declarations. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/unit.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE unit_local_declarations ----
LOCAL op == x
LOCAL f[x \in Nat] == x
LOCAL INSTANCE M
LOCAL M == INSTANCE M
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Fatal errors while parsing TLA+ spec in file unit_local_declarations
    | In module unit_local_declarations
    | Cannot find source file for module M imported in module unit_local_declarations.
    | *** Errors: 1
    | In module unit_local_declarations
    | Cannot find source file for module M imported in module unit_local_declarations.
    3002:1 Parsing or semantic analysis failed.
---*)
