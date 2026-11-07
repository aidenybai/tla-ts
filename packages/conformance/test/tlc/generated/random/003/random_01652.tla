(*---
description: Evaluates a random function expression, seed 262, number 1652.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01652 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(([[x \in 1..2 |-> x] EXCEPT ![2147483647] = <<1, 2>>] @@ [b2637 \in SUBSET {1} |-> -1]) @@ ((0 % 2) :> IF -1 THEN -1 ELSE 7)) EXCEPT ![((-(1 % 1)) + ((CHOOSE r \in [a : {1, 2}] : TRUE) - (2 * -1)))] = CASE (Cardinality(<<1>>) + ({1} = [x \in 1..2 |-> x])) -> ((CHOOSE b2638 \in {1} : FALSE) % ((1 :> 2) * 1)) [] OTHER -> ({b2639 \in SUBSET {1} : TRUE} \cup {1, 2})])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 208 to line 14, col 208 of module random_01652 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 206.
    | Expression starting at line 14, column 206.
    | ExtendableExpr starting at line 14, column 205.
    | ExtendableExpr starting at line 14, column 168.
    | Expression starting at line 14, column 168.
    | Fatal errors while parsing TLA+ spec in file random_01652
    | In module random_01652
    | Could not parse module random_01652 from file random_01652.tla
    | *** Errors: 1
    | In module random_01652
    | Could not parse module random_01652 from file random_01652.tla
    3002:1 Parsing or semantic analysis failed.
---*)
