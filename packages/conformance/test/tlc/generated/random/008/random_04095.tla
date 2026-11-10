(*---
description: Evaluates a random bool expression, seed 262, number 4095.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04095 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([[[[a |-> 1] EXCEPT !.a = 0] EXCEPT !.a = (1 \div -1)] EXCEPT !.a = @ + Head(SortSeq(<<1>>, LAMBDA p, q : p < q))] = [[[[a |-> 1] EXCEPT !.a = 1] EXCEPT !.a = Cardinality({2, 1, 3})] EXCEPT !.a = @ + (CHOOSE b6439 \in DOMAIN [x \in Nat |-> x + 1] : (FALSE => FALSE))]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 62 to line 14, col 65 of module random_04095 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 60.
    | Expression starting at line 14, column 60.
    | ExtendableExpr starting at line 14, column 59.
    | Expression starting at line 14, column 59.
    | Except Spec starting at line 14, column 53.
    | Fatal errors while parsing TLA+ spec in file random_04095
    | In module random_04095
    | Could not parse module random_04095 from file random_04095.tla
    | *** Errors: 1
    | In module random_04095
    | Could not parse module random_04095 from file random_04095.tla
    3002:1 Parsing or semantic analysis failed.
---*)
