(*---
description: Evaluates a random record expression, seed 262, number 7673.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07673 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[([1 EXCEPT !.a = @ + 2] = [[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + 3]) EXCEPT !.a = @ + Head(SortSeq(<<1>>, LAMBDA p, q : p < q))] EXCEPT !.a = (((<<5, 6>> @@ TRUE) @@ [b11812 \in 2..1 |-> b11812]))[(CASE TRUE -> 7 [] OTHER -> {1, 2} \div (2147483647 \div -1))]])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 268 to line 14, col 271 of module random_07673 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 257.
    | Expression starting at line 14, column 257.
    | ExtendableExpr starting at line 14, column 256.
    | ExtendableExpr starting at line 14, column 244.
    | Expression starting at line 14, column 244.
    | Fatal errors while parsing TLA+ spec in file random_07673
    | In module random_07673
    | Could not parse module random_07673 from file random_07673.tla
    | *** Errors: 1
    | In module random_07673
    | Could not parse module random_07673 from file random_07673.tla
    3002:1 Parsing or semantic analysis failed.
---*)
