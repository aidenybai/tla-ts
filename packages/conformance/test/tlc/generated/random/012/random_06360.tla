(*---
description: Evaluates a random function expression, seed 262, number 6360.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06360 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(((-{x \in 1..3 : x > 1}) + LET b9775 == 2 IN 7) :> ((7 * -1) - (CHOOSE b9776 \in {1, 2} : FALSE))) EXCEPT ![LET b9777 == (Head(<<3, 1, 2>>) * (1 - 7)) IN Cardinality((b9777 .. b9777))] = IF (\A b9778 \in (2..1 \cup SUBSET {1}) : (Nat = {1})) THEN Len(SubSeq(<<1, 2>>, 7, 0)) ELSE ([a |-> 1, b |-> FALSE]).a])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 73 to line 14, col 73 of module random_06360 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 71.
    | Expression starting at line 14, column 71.
    | ExtendableExpr starting at line 14, column 70.
    | Expression starting at line 14, column 70.
    | ExtendableExpr starting at line 14, column 69.
    | Fatal errors while parsing TLA+ spec in file random_06360
    | In module random_06360
    | Could not parse module random_06360 from file random_06360.tla
    | *** Errors: 1
    | In module random_06360
    | Could not parse module random_06360 from file random_06360.tla
    3002:1 Parsing or semantic analysis failed.
---*)
