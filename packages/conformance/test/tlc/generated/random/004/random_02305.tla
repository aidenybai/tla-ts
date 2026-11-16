(*---
description: Evaluates a random record expression, seed 262, number 2305.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02305 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 2] EXCEPT !.a = Head(<<>>)] EXCEPT !.a = @ + (CHOOSE b3640 \in {b3641 : b3641 \in {x \in 1..3 : x > 1}} : (~FALSE))] EXCEPT !.a = (((2 \div -1) :> (-1 * 0)) \div LET b3642 == (CHOOSE b3643 \in Nat : TRUE) IN Head(<<1>>))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 194 to line 14, col 197 of module random_02305 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 192.
    | Expression starting at line 14, column 192.
    | ExtendableExpr starting at line 14, column 191.
    | Expression starting at line 14, column 191.
    | ExtendableExpr starting at line 14, column 190.
    | Fatal errors while parsing TLA+ spec in file random_02305
    | In module random_02305
    | Could not parse module random_02305 from file random_02305.tla
    | *** Errors: 1
    | In module random_02305
    | Could not parse module random_02305 from file random_02305.tla
    3002:1 Parsing or semantic analysis failed.
---*)
