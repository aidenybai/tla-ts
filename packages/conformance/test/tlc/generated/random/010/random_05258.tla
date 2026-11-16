(*---
description: Evaluates a random int expression, seed 262, number 5258.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05258 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(CASE (CASE (\A b8139 \in {2, 1, 3} : FALSE) -> ({1} \cup 1..3) [] OTHER -> (--1) = ((7 - 3) \div IF FALSE THEN 0 ELSE 7)) -> ((CHOOSE r \in [a : {2, 1, 3}] : TRUE)).a [] OTHER -> ((CHOOSE b8140 \in ({2, 1, 3} \ Nat) : (Nat = SUBSET {1})) :> (CHOOSE b8141 \in ({x \in 1..3 : x > 1} \cap {}) : (~<<1>>))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 94 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 91.
    | Expression starting at line 14, column 91.
    | Case Other Arm starting at line 14, column 82.
    | CASE Expression starting at line 14, column 22.
    | Expression starting at line 14, column 22.
    | Fatal errors while parsing TLA+ spec in file random_05258
    | In module random_05258
    | Could not parse module random_05258 from file random_05258.tla
    | *** Errors: 1
    | In module random_05258
    | Could not parse module random_05258 from file random_05258.tla
    3002:1 Parsing or semantic analysis failed.
---*)
