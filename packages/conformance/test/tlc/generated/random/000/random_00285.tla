(*---
description: Evaluates a random record expression, seed 262, number 285.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00285 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(LET b483 == ([[[a |-> 1, b |-> TRUE] EXCEPT !.a = @ + [x \in 1..2 |-> x]] EXCEPT !.a = @ + (-3)]).a IN (IF (Nat \subseteq {x \in 1..3 : x > 1}) THEN Len(<<>>) ELSE (b483 \div -1) % ((b483 + 7) + Head(<<1, 2>>))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 186 to line 14, col 189 of module random_00285 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 181.
    | Expression starting at line 14, column 181.
    | ExtendableExpr starting at line 14, column 180.
    | Expression starting at line 14, column 180.
    | IF THEN ELSE starting at line 14, column 120.
    | Fatal errors while parsing TLA+ spec in file random_00285
    | In module random_00285
    | Could not parse module random_00285 from file random_00285.tla
    | *** Errors: 1
    | In module random_00285
    | Could not parse module random_00285 from file random_00285.tla
    3002:1 Parsing or semantic analysis failed.
---*)
