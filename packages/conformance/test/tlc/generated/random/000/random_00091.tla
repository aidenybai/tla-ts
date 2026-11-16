(*---
description: Evaluates a random bool expression, seed 262, number 91.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00091 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[([[x \in 1..2 |-> x] EXCEPT ![1] = 7] @@ ([x \in Nat |-> x + 1] @@ <<5, 6>>)) EXCEPT ![Cardinality(({1, 2} \cup 2..1))] = Head(Append(<<1, 2>>, 2147483647))] EXCEPT ![(CHOOSE b141 \in (({1, 2} \ Nat) \cap {b142 : b142 \in {1}}) : ((CHOOSE r \in [a : 1..2] : TRUE) = [a |-> b141, b |-> TRUE]))] = Append((<<1, -1>> \o [<<>> EXCEPT ![1] = 1]), ((-3) + (--1)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 371 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 368.
    | ExtendableExpr starting at line 14, column 361.
    | Expression starting at line 14, column 361.
    | ExtendableExpr starting at line 14, column 360.
    | Expression starting at line 14, column 360.
    | Fatal errors while parsing TLA+ spec in file random_00091
    | In module random_00091
    | Could not parse module random_00091 from file random_00091.tla
    | *** Errors: 1
    | In module random_00091
    | Could not parse module random_00091 from file random_00091.tla
    3002:1 Parsing or semantic analysis failed.
---*)
