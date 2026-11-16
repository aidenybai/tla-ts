(*---
description: Evaluates a random seq expression, seed 262, number 9661.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09661 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([DOMAIN (CHOOSE f \in [{1, 2} \cap {2} -> {1, 2} \cap {2}] : TRUE) EXCEPT ![1] = CASE (Nat = 2..1) -> ((1 :> 2))[2] [] OTHER -> (7 :> 1)] \o ((CHOOSE b15000 \in (1..3 \cup 2..1) : (TRUE /\ FALSE)) \o <<[<<3, 1, 2>> EXCEPT !.a = @ + 1], (--1)>>)))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 256 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 253.
    | Expression starting at line 14, column 253.
    | Some << -- >> or >>_ Form starting at line 14, column 217.
    | ExtendableExpr starting at line 14, column 217.
    | ExtendableExpr starting at line 14, column 159.
    | Fatal errors while parsing TLA+ spec in file random_09661
    | In module random_09661
    | Could not parse module random_09661 from file random_09661.tla
    | *** Errors: 1
    | In module random_09661
    | Could not parse module random_09661 from file random_09661.tla
    3002:1 Parsing or semantic analysis failed.
---*)
