(*---
description: Evaluates a random function expression, seed 262, number 762.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00762 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([((Cardinality(SUBSET {1}) * Cardinality({2, 1, 3})) :> (([x \in Nat |-> x + 1] = [a |-> 1]) \div LET b1247 == 7 IN 7)) EXCEPT ![(((CHOOSE b1248 \in <<5, 6>> : TRUE) \div Cardinality({x \in 1..3 : x > 1})) * LET b1249 == (--1) IN (3 \div b1249))] = (((7 :> 2147483647) @@ [[x \in 1..2 |-> x] EXCEPT ![7] = -1]) % ((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)).a)])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 240 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 237.
    | Expression starting at line 14, column 237.
    | Definition starting at line 14, column 228.
    | Let Definitions starting at line 14, column 228.
    | Case Other Arm starting at line 14, column 224.
    | Fatal errors while parsing TLA+ spec in file random_00762
    | In module random_00762
    | Could not parse module random_00762 from file random_00762.tla
    | *** Errors: 1
    | In module random_00762
    | Could not parse module random_00762 from file random_00762.tla
    3002:1 Parsing or semantic analysis failed.
---*)
