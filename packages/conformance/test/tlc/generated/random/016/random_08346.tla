(*---
description: Evaluates a random record expression, seed 262, number 8346.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08346 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> CASE (FALSE \/ TRUE) -> (0 + 2147483647) [] OTHER -> (0 % 3), b |-> ((7 \div -1) \in {b12910 \in FALSE : TRUE})] EXCEPT !.a = @ + (LET b12911 == Head(<<1, 2>>) IN (2147483647)[2] + Cardinality(({2, 1, 3} \cup SUBSET {1})))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 96 to line 14, col 99 of module random_08346 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 94.
    | Expression starting at line 14, column 94.
    | ExtendableExpr starting at line 14, column 93.
    | Expression starting at line 14, column 93.
    | ExtendableExpr starting at line 14, column 92.
    | Fatal errors while parsing TLA+ spec in file random_08346
    | In module random_08346
    | Could not parse module random_08346 from file random_08346.tla
    | *** Errors: 1
    | In module random_08346
    | Could not parse module random_08346 from file random_08346.tla
    3002:1 Parsing or semantic analysis failed.
---*)
