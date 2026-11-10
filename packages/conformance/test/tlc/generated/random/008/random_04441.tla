(*---
description: Evaluates a random bool expression, seed 262, number 4441.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04441 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE (Len([x \in 1..2 |-> x]) = Cardinality(SUBSET {1})) -> (DOMAIN (1 :> 2) - (3 % (1 :> 2))) [] OTHER -> ([[x \in Nat |-> x + 1] EXCEPT ![3] = 3])[Cardinality({1})] = (Cardinality(UNION {[a |-> 1], 2..1}) % ((2147483647 * 0) \div ([a |-> 1, b |-> TRUE]).a))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops DOMAIN in block line 14, col 78 to line 14, col 83 of module random_04441 and -.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 85.
    | Expression starting at line 14, column 78.
    | ExtendableExpr starting at line 14, column 77.
    | Expression starting at line 14, column 77.
    | Case Arm starting at line 14, column 22.
    | Fatal errors while parsing TLA+ spec in file random_04441
    | In module random_04441
    | Could not parse module random_04441 from file random_04441.tla
    | *** Errors: 1
    | In module random_04441
    | Could not parse module random_04441 from file random_04441.tla
    3002:1 Parsing or semantic analysis failed.
---*)
