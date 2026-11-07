(*---
description: Isabelle cannot write -+->, so the obligation fails with Unsupported operator as its reason, before Isabelle runs.
ref: src/backend/isabelle.ml#pp_apply
mode: encoding
outcome: failed
---*)
---- MODULE actplus_unsupported ----
EXTENDS TLAPS
VARIABLE x
THEOREM (x = 1 -+-> x = 2) => TRUE
  BY Isa
====

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:3:11:5
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 11:3:11:5
    @status: failed
    @prover: isabelle
    @meth: auto; time-limit: 30
    @reason: Unsupported operator `-+->`.
    @already: false
    @obl: 
    ASSUME NEW VARIABLE x,
           TRUE 
    PROVE  x = 1 -+-> x = 2 => TRUE

    @type: obligation
    @id: 2
    @loc: 11:6:11:9
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 11:6:11:9
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./actplus_unsupported.tla", line 11, characters 3-4:
    [ERROR]: Could not prove or check:
               ASSUME NEW VARIABLE x,
                      Isa 
               PROVE  x = 1 -+-> x = 2 => TRUE
    File "./actplus_unsupported.tla", line 7, character 1 to line 12, character 4:
    [ERROR]: 1/2 obligations failed.
    There were backend errors processing module `"actplus_unsupported"`.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory actplus_unsupported imports Constant Zenon begin
    ML_command \<open> writeln ("*** TLAPS PARSED\n"); \<close>
    consts
      "isReal" :: c
      "isa_slas_a" :: "[c,c] => c"
      "isa_bksl_diva" :: "[c,c] => c"
      "isa_perc_a" :: "[c,c] => c"
      "isa_peri_peri_a" :: "[c,c] => c"
      "isInfinity" :: c
      "isa_lbrk_rbrk_a" :: "[c] => c"
      "isa_less_more_a" :: "[c] => c"

    end

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory tlapm_<id> imports Constant Zenon begin
    consts
      "isReal" :: c
      "isa_slas_a" :: "[c,c] => c"
      "isa_bksl_diva" :: "[c,c] => c"
      "isa_perc_a" :: "[c,c] => c"
      "isa_peri_peri_a" :: "[c,c] => c"
      "isInfinity" :: c
      "isa_lbrk_rbrk_a" :: "[c] => c"
      "isa_less_more_a" :: "[c] => c"

    (* Generated from file "./actplus_unsupported.tla", line 11, characters 3-4 *)
    lemma ob'1: (* 1faa6d428df4b4c5f6907e1c90683aca *)
    (* usable definition CONSTANT_EnabledWrapper_ suppressed *)
    (* usable definition CONSTANT_CdotWrapper_ suppressed *)
    fixes a_VARIABLEunde_xunde_a a_VARIABLEunde_xunde_a'
---*)
