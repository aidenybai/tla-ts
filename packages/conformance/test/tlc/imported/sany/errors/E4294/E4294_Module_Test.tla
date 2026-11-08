(*---
description: SANY reports E4294. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/E4294_Module_Test.tla
features:
  - sany-errors
outcome: parse-error
---*)
Nested module declarations cannot occur in between the declaration of a
recursive operator and its definition.
---- MODULE E4294_Module_Test ----
RECURSIVE op
---- MODULE Inner ----
====
op == 0
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | util.WrongInvocationException: Defined more recursive operators than were declared in RECURSIVE statements.
    2171:1 Parsing or semantic analysis failed.
    2171:0 Parsing or semantic analysis failed.util.WrongInvocationException: Defined more recursive operators than were declared in RECURSIVE statements.
---*)
