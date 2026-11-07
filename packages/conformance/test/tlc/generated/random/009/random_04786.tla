(*---
description: Evaluates a random function expression, seed 262, number 4786.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04786 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([([[x \in 1..2 |-> x] EXCEPT ![7] = 3] @@ (-1 :> 7)) EXCEPT ![CASE (\A b7472 \in {} : TRUE) -> Head(<<3, 1, 2>>) [] OTHER -> ([a |-> 1, b |-> TRUE]).a] = IF (<<>> = (1 :> 2)) THEN (3 % 1) ELSE (3)[2]] @@ [[b7473 \in (2..1 \ {2, 1, 3}) |-> (0 + b7473)] EXCEPT ![((7 \div -1) + LET b7474 == 2 IN b7474)] = (-Cardinality({}))]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 282 to line 14, col 285 of module random_04786 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 280.
    | Expression starting at line 14, column 280.
    | ExtendableExpr starting at line 14, column 279.
    | Expression starting at line 14, column 279.
    | ExtendableExpr starting at line 14, column 278.
    | Fatal errors while parsing TLA+ spec in file random_04786
    | In module random_04786
    | Could not parse module random_04786 from file random_04786.tla
    | *** Errors: 1
    | In module random_04786
    | Could not parse module random_04786 from file random_04786.tla
    3002:1 Parsing or semantic analysis failed.
---*)
