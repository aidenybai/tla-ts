(*---
description: SANY reports E4312. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4312_LeadsTo_L_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
Leads-to operator ~> cannot have an action-level parameter.
This has to be a special-case check since ~> allows temporal-level parameters.
---- MODULE E4312_LeadsTo_L_Test ----
VARIABLE v
op == (v') ~> v
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 12, col 7 to line 12, col 15 of module E4312_LeadsTo_L_Test
    | Action used where only temporal formula or state predicate allowed.
    3002:1 Parsing or semantic analysis failed.
---*)
