//Liberally adapted from "hey-catch" by Mana#4176
import { Skills } from "src/types/template";
import TwodsixActor from "../entities/TwodsixActor";
import { getItemDataFromDropData } from "../utils/sheetUtils";
Hooks.on('dropCanvasData', catchDrop);

async function catchDrop(canvasObject: Canvas, dropData) {

  if ((dropData.type === 'damageItem' || dropData.type === "Item") && game.settings.get("twodsix", "allowDropOnIcon")) {
    // Reference used: PlaceablesLayer.selectObjects
    // Find token(s) at drop location
    const foundTokens = getTokensAtLocation(canvasObject, dropData.x, dropData.y);

    if (foundTokens?.length === 0 || !foundTokens) {
      return ui.notifications?.info(game.i18n.localize("TWODSIX.Warnings.NoTargetFound"));
    } else if (foundTokens.length === 1) {
      //console.log('Dropped On:', found[0]);

      const actor = foundTokens[0]?.actor;
      //console.log(actor);

      if (!actor?.isOwner) {
        return ui.notifications?.warn(game.i18n.localize("TWODSIX.Warnings.LackPermissionToDamage"));
      }

      if (actor.data.type === 'traveller') {
        if (dropData.type === 'damageItem') {
          await (<TwodsixActor>actor).damageActor(dropData.payload.damage, dropData.payload.armorPiercingValue, true);
        } else if (dropData.type === 'Item') {
          const itemData = await getItemDataFromDropData(dropData);

          if (isSameActor(actor, itemData)) {
            console.log(`Twodsix | Moved Skill ${itemData.name} to another position in the skill list`);
            return;
          }

          if (isDuplicateItem(actor, itemData)) {
            console.log(`Twodsix | Skill ${itemData.name} already on character ${actor.name}.`);
            const dupItem:TwodsixItem = actor.data.items.filter(x => x.name === itemData.name)[0];
            if( dupItem.data.type !== "skills"  && dupItem.data.type !== "trait" && dupItem.data.type !== "ship_position") {
              const newQuantity = dupItem.data.data.quantity + 1;
              dupItem.update({"data.quantity": newQuantity});
            }
            return;
          }

          if (itemData.type === "skills") {
            handleDroppedSkills(<TwodsixActor>actor, itemData);
          } else if (!["component"].includes(itemData.type)) {
            handleDroppedItem(actor, itemData);
          }
        }
      } else {
        ui.notifications.warn(game.i18n.localize("TWODSIX.Warnings.CantDropOnShipToken"));
      }
      return false;
    } else if (foundTokens.length > 1) {
      // Make sure only one token is there to avoid mistakes
      return ui.notifications?.warn(game.i18n.localize("TWODSIX.Warnings.MultipleActorsFound"));
    }
  }
}

function getTokensAtLocation(canvasObject: Canvas, x: number, y: number) {
  const controllable = canvasObject.tokens?.placeables.filter(obj => obj.visible && obj.actor && obj.control instanceof Function);
  const foundTokens = controllable?.filter(obj => {
    const w = obj.width, h = obj.height;
    return Number.between(x, obj.x, obj.x + w) && Number.between(y, obj.y, obj.y + h);
  });
  return foundTokens;
}

function handleDroppedSkills(actor: TwodsixActor, itemData: TwodsixItem) {
  // Handle item sorting within the same Actor
  const droppedSkill = duplicate(itemData);

  if (!game.settings.get('twodsix', 'hideUntrainedSkills')) {
    const skills:Skills = <Skills>game.system.template.Item?.skills;
    (<Skills>droppedSkill.data).value = skills?.value;
  } else {
    (<Skills>droppedSkill.data).value = 0;
  }

  actor.createEmbeddedDocuments("Item", [droppedSkill]);
  console.log(`Twodsix | Added Skill ${droppedSkill.name} to character`);
}

function handleDroppedItem(actor:Actor, itemData:any) {
  const droppedItem = duplicate(itemData);

  //Remove any attached consumables
  if (droppedItem.data.consumables !== undefined) {
    if (droppedItem.data.consumables.length > 0) {
      droppedItem.data.consumables = [];
    }
  }

  //Link an actor skill with name defined by item.associatedSkillName
  if (droppedItem.data.associatedSkillName !== "") {
    droppedItem.data.skill = actor.items.getName(droppedItem.data.associatedSkillName)?.data._id;
  }

  actor.createEmbeddedDocuments("Item", [droppedItem]);
}

function isDuplicateItem(actor: Actor, itemData: any):boolean {
  const retValue = actor.data.items.filter(x => x.name === itemData.name);
  return retValue.length > 0 ? true : false;
}

function isSameActor(actor: Actor, itemData: any): boolean {
  return (itemData.actor?.id === actor.id) || (actor.isToken && (itemData.actor?.id === actor.token?.id));
}