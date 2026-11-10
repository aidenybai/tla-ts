(*---
description: Evaluates a random bool expression, seed 262, number 3238.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03238 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[[[a |-> 1] EXCEPT !.a = @ + 7] EXCEPT !.a = @ + (0 \div 0)] EXCEPT !.a = @ + ((2147483647 \div -1) * ((1 :> 2) @@ TRUE))] => (((-3) < (-3)) => ((\E b5146 \in 1..3 : TRUE) /\ (\A b5147 \in <<>> : TRUE)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 109 to line 14, col 112 of module random_03238 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 98.
    | Expression starting at line 14, column 98.
    | ExtendableExpr starting at line 14, column 97.
    | Expression starting at line 14, column 97.
    | ExtendableExpr starting at line 14, column 96.
    | Fatal errors while parsing TLA+ spec in file random_03238
    | In module random_03238
    | Could not parse module random_03238 from file random_03238.tla
    | *** Errors: 1
    | In module random_03238
    | Could not parse module random_03238 from file random_03238.tla
    3002:1 Parsing or semantic analysis failed.
---*)
