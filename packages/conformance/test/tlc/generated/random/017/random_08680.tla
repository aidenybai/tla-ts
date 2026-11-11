(*---
description: Evaluates a random function expression, seed 262, number 8680.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08680 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(Cardinality(UNION {Nat, {}}) :> ((3 \div 7) * (1 \div -1))) EXCEPT ![((<<2147483647, 3>> @@ [[x \in Nat |-> x + 1] EXCEPT ![-1] = 3]))[LET b13439 == ([a |-> 1]).a IN (CHOOSE b13440 \in {x \in 1..3 : x > 1} : TRUE)]] = (((CHOOSE f \in [{1, 2} \ {1} -> {1, 2}] : TRUE) @@ (<<5, 6>> @@ [x \in 1..2 |-> x])))[LET b13441 == (-1 + 1) IN Cardinality({2, 1, 3})]])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 67 to line 14, col 70 of module random_08680 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 65.
    | Expression starting at line 14, column 65.
    | ExtendableExpr starting at line 14, column 64.
    | ExtendableExpr starting at line 14, column 51.
    | Expression starting at line 14, column 51.
    | Fatal errors while parsing TLA+ spec in file random_08680
    | In module random_08680
    | Could not parse module random_08680 from file random_08680.tla
    | *** Errors: 1
    | In module random_08680
    | Could not parse module random_08680 from file random_08680.tla
    3002:1 Parsing or semantic analysis failed.
---*)
