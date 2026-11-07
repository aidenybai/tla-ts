(*---
description: "SANY accepts an empty tuple pattern, but Generator.java counts one binder named >> for it, so TLC cannot bind it and fails with an argument mismatch message that still shows its %1 placeholder."
ref: "tla2sany/parser/TLAplusParser.java#IdentifierTuple"
features: [tuples, tlc-bug]
outcome: evaluation-failure
---*)
---- MODULE pattern_empty ----
ASSUME \A <<>> \in {<<>>} : TRUE
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    2170:0 Argument mismatch in operator application.%1
    2170:0 Argument mismatch in operator application.%1
---*)
