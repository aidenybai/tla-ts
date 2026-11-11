(*---
description: Evaluates a random function expression, seed 262, number 9445.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09445 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((((Len(<<1>>) :> (0 \div -1)) @@ ((-1 :> 1) @@ [<<5, 6>> EXCEPT ![0] = 1])) @@ [b14658 \in ({b14659 \in {1, 2} : FALSE} \cup (1 .. 2147483647)) |-> (LET b14660 == 3 IN b14658 + (-b14658))]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 36 to line 14, col 39 of module random_09445 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 34.
    | Expression starting at line 14, column 34.
    | ExtendableExpr starting at line 14, column 33.
    | ExtendableExpr starting at line 14, column 19.
    | Expression starting at line 14, column 19.
    | Fatal errors while parsing TLA+ spec in file random_09445
    | In module random_09445
    | Could not parse module random_09445 from file random_09445.tla
    | *** Errors: 1
    | In module random_09445
    | Could not parse module random_09445 from file random_09445.tla
    3002:1 Parsing or semantic analysis failed.
---*)
