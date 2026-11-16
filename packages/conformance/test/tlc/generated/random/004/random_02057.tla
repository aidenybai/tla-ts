(*---
description: Evaluates a random seq expression, seed 262, number 2057.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02057 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((<<IF (3 \in {2, 1, 3}) THEN LET b3273 == {1, 2} IN 2 ELSE (2 * 1), IF (FALSE /\ TRUE) THEN (2 * 2) ELSE (2147483647 \div -1)>> \o [a |-> (CHOOSE b3274 \in UNION {SUBSET {1}, {}} : (\A b3275 \in 1..3 : TRUE)), b |-> ((FALSE => FALSE) => (\A b3276 \in {1, 2} : TRUE))]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 133 to line 14, col 136 of module random_02057 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 122.
    | Expression starting at line 14, column 122.
    | ExtendableExpr starting at line 14, column 121.
    | Expression starting at line 14, column 121.
    | IF THEN ELSE starting at line 14, column 84.
    | Fatal errors while parsing TLA+ spec in file random_02057
    | In module random_02057
    | Could not parse module random_02057 from file random_02057.tla
    | *** Errors: 1
    | In module random_02057
    | Could not parse module random_02057 from file random_02057.tla
    3002:1 Parsing or semantic analysis failed.
---*)
