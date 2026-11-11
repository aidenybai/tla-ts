(*---
description: Evaluates a random function expression, seed 262, number 1878.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01878 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((Head(<<(2147483647 + 2), (2 \div -1)>>) :> (((2..1 \cap {1, 2}) = ({x \in 1..3 : x > 1} \cap {2, 1, 3})) /\ (([a |-> 1] = [a |-> 1, b |-> TRUE]) <=> (TRUE => TRUE)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 45 to line 14, col 48 of module random_01878 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 43.
    | Expression starting at line 14, column 43.
    | ExtendableExpr starting at line 14, column 42.
    | Expression starting at line 14, column 42.
    | Some << -- >> or >>_ Form starting at line 14, column 22.
    | Fatal errors while parsing TLA+ spec in file random_01878
    | In module random_01878
    | Could not parse module random_01878 from file random_01878.tla
    | *** Errors: 1
    | In module random_01878
    | Could not parse module random_01878 from file random_01878.tla
    3002:1 Parsing or semantic analysis failed.
---*)
