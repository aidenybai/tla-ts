(*---
description: -dump class, names a class that must load.
ref: tlc2/TLC.java#handleParameters
outcome: usage-error
config: ""
args:
  - -dump
  - class,no.such.Writer
---*)
---- MODULE dump_class_not_found ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 1
  transcript: |-
    1102:1 Trying to instantiate a custom IStateWriter implementation no.such.Writer.
    Usage: java tlc2.TLC [-help] [-option] inputfile
---*)
