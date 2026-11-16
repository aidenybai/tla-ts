(*---
description: SANY reports E4334. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4334_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
It is an error to use labels in inner nested ASSUME/PROVE blocks when that
block also introduces a new symbol using a NEW statement. Why this is the
case for nested ASSUME/PROVE blocks but not top-level ones is unknown.
---- MODULE E4334_Test ----
THEOREM thm ==
  ASSUME
    ASSUME
      NEW x \in {},
      lbl :: TRUE
    PROVE TRUE
  PROVE TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 1
    | line 16, col 7 to line 16, col 17 of module E4334_Test
    | Label not allowed within scope of declaration in nested ASSUME/PROVE.
    3002:1 Parsing or semantic analysis failed.
---*)
