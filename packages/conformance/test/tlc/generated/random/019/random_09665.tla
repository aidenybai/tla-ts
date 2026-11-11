(*---
description: Evaluates a random seq expression, seed 262, number 9665.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09665 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(([<<-1, 2>> EXCEPT ![1] = (2 % 0)] \o <<(--1), (CHOOSE b15002 \in FALSE : FALSE)>>), (((-1 :> 0))[([x \in 1..2 |-> x])[1]] + ((CHOOSE r \in [a : {1, 2} \cap {2}] : TRUE)).a)))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 66 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 63.
    | Expression starting at line 14, column 63.
    | Some << -- >> or >>_ Form starting at line 14, column 61.
    | ExtendableExpr starting at line 14, column 61.
    | ExtendableExpr starting at line 14, column 24.
    | Fatal errors while parsing TLA+ spec in file random_09665
    | In module random_09665
    | Could not parse module random_09665 from file random_09665.tla
    | *** Errors: 1
    | In module random_09665
    | Could not parse module random_09665 from file random_09665.tla
    3002:1 Parsing or semantic analysis failed.
---*)
