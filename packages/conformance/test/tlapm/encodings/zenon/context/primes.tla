(*---
description: The action frontend renames a primed variable to a separate constant.
ref: src/frontend/action.ml#process_obligation
mode: encoding
outcome: proved
---*)
---- MODULE primes ----
EXTENDS TLAPS
VARIABLE x
THEOREM x' = 1 => x' = 1
  BY Zenon
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 11:3:11:5
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 11:3:11:5
    @status: proved
    @prover: zenon
    @meth: time-limit: 10
    @already: false

    @type: obligation
    @id: 2
    @loc: 11:6:11:11
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 11:6:11:11
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 2

    File "./primes.tla", line 7, character 1 to line 12, character 4:
    [INFO]: All 2 obligations proved.

    --- isabelle
    (* automatically generated -- do not edit manually *)
    theory primes imports Constant Zenon begin
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

    lemma ob'1:
    (* usable definition CONSTANT_EnabledWrapper_ suppressed *)
    (* usable definition CONSTANT_CdotWrapper_ suppressed *)
    fixes a_VARIABLEunde_xunde_a a_VARIABLEunde_xunde_a'
    shows "((((((a_VARIABLEunde_xunde_hash_primea :: c)) = ((succ[0])))) \<Rightarrow> ((((a_VARIABLEunde_xunde_hash_primea :: c)) = ((succ[0]))))))"(is "PROP ?ob'1")
    proof -
    ML_command \<open> writeln "*** TLAPS ENTER 1"; \<close>
    show "PROP ?ob'1"

    (* BEGIN ZENON INPUT
    ;; <zenon command>
    ;; obligation #1
    $goal (=> (= a_VARIABLEunde_xunde_hash_primea (TLA.fapply TLA.Succ 0))
    (= a_VARIABLEunde_xunde_hash_primea
    (TLA.fapply TLA.Succ 0)))
    END ZENON  INPUT *)
    (* PROOF-FOUND *)
    (* BEGIN-PROOF *)
    proof (rule zenon_nnpp)
     assume z_Ha:"(~((a_VARIABLEunde_xunde_hash_primea=1)=>(a_VARIABLEunde_xunde_hash_primea=1)))" (is "~(?z_hc=>_)")
     have z_Hc: "?z_hc" (is "_=?z_he")
     by (rule zenon_notimply_0 [OF z_Ha])
     have z_Hf: "(a_VARIABLEunde_xunde_hash_primea~=?z_he)"
     by (rule zenon_notimply_1 [OF z_Ha])
     show FALSE
     by (rule notE [OF z_Hf z_Hc])
    qed
    (* END-PROOF *)
    ML_command \<open> writeln "*** TLAPS EXIT 1"; \<close> qed
    end

    --- zenon
    ;; obligation #1
    $goal (=> (= a_VARIABLEunde_xunde_hash_primea (TLA.fapply TLA.Succ 0))
    (= a_VARIABLEunde_xunde_hash_primea
    (TLA.fapply TLA.Succ 0)))
---*)
