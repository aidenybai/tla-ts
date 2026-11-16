(*---
description: Evaluates a random set expression, seed 262, number 2986.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02986 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((SelectSeq(SubSeq(<<3, 1, 2>>, 1, 3), LAMBDA e : e > 0) :> ((CHOOSE b4741 \in Nat : FALSE) % Cardinality({}))) @@ [b4742 \in ((-1 .. -1) \cap DOMAIN [x \in 1..2 |-> x]) |-> ((3 * -1) % (2147483647 - 7))]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 194 to line 14, col 194 of module random_02986 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 192.
    | Expression starting at line 14, column 192.
    | ExtendableExpr starting at line 14, column 191.
    | Expression starting at line 14, column 191.
    | ExtendableExpr starting at line 14, column 190.
    | Fatal errors while parsing TLA+ spec in file random_02986
    | In module random_02986
    | Could not parse module random_02986 from file random_02986.tla
    | *** Errors: 1
    | In module random_02986
    | Could not parse module random_02986 from file random_02986.tla
    3002:1 Parsing or semantic analysis failed.
---*)
