(*---
description: Evaluates a random set expression, seed 262, number 3118.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03118 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(UNION {(((Nat \ {}) \cap DOMAIN (1 :> 2)) \ {(3 * -1), Cardinality({1, 2})}), {LET b4982 == (-b4981) IN CASE TRUE -> b4981 [] OTHER -> 1 : b4981 \in ({2147483647, -1} \ DOMAIN [x \in Nat |-> x + 1])}})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 64 to line 14, col 64 of module random_03118 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 62.
    | Expression starting at line 14, column 62.
    | ExtendableExpr starting at line 14, column 61.
    | Expression starting at line 14, column 61.
    | Some { } form starting at line 14, column 60.
    | Fatal errors while parsing TLA+ spec in file random_03118
    | In module random_03118
    | Could not parse module random_03118 from file random_03118.tla
    | *** Errors: 1
    | In module random_03118
    | Could not parse module random_03118 from file random_03118.tla
    3002:1 Parsing or semantic analysis failed.
---*)
