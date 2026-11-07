(*---
description: Evaluates a random function expression, seed 262, number 2485.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02485 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b3910 \in (([[a |-> 1] EXCEPT !.a = @ + 3]).a .. Head(Tail(<<1, 2>>))) |-> ((DOMAIN <<5, 6>> % IF FALSE THEN FALSE ELSE b3910) * CASE ([a |-> 1, b |-> TRUE] = [a |-> 1]) -> ((1 :> 2))[b3910] [] OTHER -> SelectSeq(<<1, 2>>, LAMBDA e : e > 0))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops DOMAIN in block line 14, col 94 to line 14, col 99 of module random_02485 and %.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 101.
    | Expression starting at line 14, column 94.
    | ExtendableExpr starting at line 14, column 93.
    | Expression starting at line 14, column 93.
    | ExtendableExpr starting at line 14, column 92.
    | Fatal errors while parsing TLA+ spec in file random_02485
    | In module random_02485
    | Could not parse module random_02485 from file random_02485.tla
    | *** Errors: 1
    | In module random_02485
    | Could not parse module random_02485 from file random_02485.tla
    3002:1 Parsing or semantic analysis failed.
---*)
