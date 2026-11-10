(*---
description: Evaluates a random function expression, seed 262, number 2882.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02882 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE ([[a |-> 1, b |-> TRUE] EXCEPT !.a = [a |-> 1, b |-> TRUE]] = [[a |-> 1, b |-> TRUE] EXCEPT !.a = -1]) -> ((3 + 0) - (SUBSET {1})[0]) [] OTHER -> (((1 :> 2))[7] - (0 % 7)) :> Cardinality(((2147483647 % 2147483647) .. (7 \div -1)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 242 to line 14, col 245 of module random_02882 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 240.
    | Expression starting at line 14, column 240.
    | ExtendableExpr starting at line 14, column 239.
    | ExtendableExpr starting at line 14, column 210.
    | Expression starting at line 14, column 210.
    | Fatal errors while parsing TLA+ spec in file random_02882
    | In module random_02882
    | Could not parse module random_02882 from file random_02882.tla
    | *** Errors: 1
    | In module random_02882
    | Could not parse module random_02882 from file random_02882.tla
    3002:1 Parsing or semantic analysis failed.
---*)
